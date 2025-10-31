"use client";

import { useCallback } from "react";
import {
  MAX_ATTACHMENTS_PER_PRODUCT,
  patchWizardProduct,
  useServiceRequestWizardDispatch,
  useServiceRequestWizardState,
} from "./use-service-request-wizard";
import {
  createUploadTask,
  handleUploadError,
  uploadAttachment,
  validateAttachmentCount,
  validateAttachmentFile,
} from "@/utils/upload-service-media";

export function useAttachmentQueue() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();

  const getAttachments = useCallback(
    (productId: string) => {
      const product = state.products.find((item) => item.id === productId);
      return product?.attachments ?? [];
    },
    [state.products]
  );

  const removeAttachment = useCallback(
    (productId: string, attachmentId: string) => {
      patchWizardProduct(dispatch, productId, (product) => {
        const target = product.attachments.find((attachment) => attachment.id === attachmentId);
        if (target?.previewUrl) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return {
          ...product,
          attachments: product.attachments.filter((attachment) => attachment.id !== attachmentId),
        };
      });
    },
    [dispatch]
  );

  const selectFiles = useCallback(
    async (productId: string, files: FileList | File[]) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product || !files || files.length === 0) {
        return;
      }

      let queuedAttachments = [...product.attachments];

      for (const file of Array.from(files)) {
        try {
          validateAttachmentCount(queuedAttachments);
          validateAttachmentFile(file);

          const task = createUploadTask(productId, file);
          const previewUrl = URL.createObjectURL(file);

          patchWizardProduct(dispatch, productId, (current) => ({
            ...current,
            attachments: [
              ...current.attachments,
              {
                id: task.attachmentId,
                fileName: file.name,
                size: file.size,
                type: file.type,
                status: "uploading",
                progress: 0,
                previewUrl,
              },
            ],
          }));

          queuedAttachments = getAttachments(productId);

          const { promise } = uploadAttachment(task, (progress) => {
            patchWizardProduct(dispatch, productId, (current) => ({
              ...current,
              attachments: current.attachments.map((attachment) =>
                attachment.id === task.attachmentId ? { ...attachment, progress } : attachment
              ),
            }));
          });

          promise
            .then((result) => {
              patchWizardProduct(dispatch, productId, (current) => ({
                ...current,
                attachments: current.attachments.map((attachment) =>
                  attachment.id === result.attachmentId
                    ? {
                        ...attachment,
                        status: "uploaded",
                        progress: 100,
                        path: result.path,
                      }
                    : attachment
                ),
              }));
            })
            .catch((error) => {
              handleUploadError(error);
              patchWizardProduct(dispatch, productId, (current) => ({
                ...current,
                attachments: current.attachments.map((attachment) =>
                  attachment.id === task.attachmentId
                    ? {
                        ...attachment,
                        status: "error",
                        progress: 0,
                        errorMessage: error instanceof Error ? error.message : "Upload thất bại",
                      }
                    : attachment
                ),
              }));
            });
        } catch (error) {
          handleUploadError(error);
        }
      }
    },
    [dispatch, getAttachments, state.products]
  );

  return {
    getAttachments,
    selectFiles,
    removeAttachment,
    canAddMore: (productId: string) =>
      getAttachments(productId).length < MAX_ATTACHMENTS_PER_PRODUCT,
  };
}
