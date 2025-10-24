// Delivery Confirmation Modal
// Story 1.14: Customer Delivery Confirmation Workflow

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SignatureCanvas } from '@/components/signature-canvas';
import { useConfirmDelivery } from '@/hooks/use-delivery';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { IconCheck, IconLoader, IconPackage, IconUser, IconPhone } from '@tabler/icons-react';

interface DeliveryConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    id: string;
    ticket_number: string;
    customer: {
      name: string;
      phone: string;
    };
    product: {
      name: string;
    };
  };
}

export function DeliveryConfirmationModal({
  open,
  onOpenChange,
  ticket,
}: DeliveryConfirmationModalProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const { confirmDeliveryAsync, isConfirming } = useConfirmDelivery();

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setShowSignature(false);
    toast.success('Đã lưu chữ ký');
  };

  const handleSignatureCancel = () => {
    setShowSignature(false);
  };

  const handleConfirm = async () => {
    if (!signatureDataUrl) {
      toast.error('Vui lòng thu thập chữ ký khách hàng');
      return;
    }

    try {
      setIsUploading(true);

      // Convert data URL to Blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      // Create File from Blob
      const file = new File([blob], `signature-${ticket.id}.png`, {
        type: 'image/png',
      });

      // Upload to Supabase Storage
      const supabase = createClient();
      const filePath = `delivery-signatures/${ticket.id}/${Date.now()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(uploadData.path);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Confirm delivery via tRPC
      await confirmDeliveryAsync({
        ticket_id: ticket.id,
        signature_url: urlData.publicUrl,
        notes: notes || undefined,
      });

      toast.success(`Đã xác nhận giao hàng cho phiếu ${ticket.ticket_number}`);
      handleClose();
      router.refresh();
    } catch (error) {
      console.error('Delivery confirmation error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi xác nhận giao hàng'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setSignatureDataUrl(null);
    setShowSignature(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác nhận giao hàng</DialogTitle>
          <DialogDescription>
            Xác nhận đã giao sản phẩm cho khách hàng - Phiếu {ticket.ticket_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Khách hàng:</span>
                  <span className="text-sm">{ticket.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Số điện thoại:</span>
                  <span className="text-sm">{ticket.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconPackage className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sản phẩm:</span>
                  <span className="text-sm">{ticket.product.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature Section */}
          <div className="space-y-2">
            <Label>Chữ ký khách hàng *</Label>
            {showSignature ? (
              <SignatureCanvas
                onSave={handleSignatureSave}
                onCancel={handleSignatureCancel}
              />
            ) : (
              <div className="space-y-2">
                {signatureDataUrl ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="border rounded-md p-4 bg-white">
                          <img
                            src={signatureDataUrl}
                            alt="Customer signature"
                            className="max-w-full h-auto"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSignature(true)}
                        >
                          Thu thập lại chữ ký
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSignature(true)}
                  >
                    Thu thập chữ ký khách hàng
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Delivery Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú giao hàng</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú về việc giao hàng (tùy chọn)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isUploading || isConfirming}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading || isConfirming}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!signatureDataUrl || isUploading || isConfirming}
            >
              {isUploading || isConfirming ? (
                <>
                  <IconLoader className="h-4 w-4 mr-1 animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4 mr-1" />
                  Xác nhận giao hàng
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
