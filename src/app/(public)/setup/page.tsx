'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/components/providers/trpc-provider';

export default function SetupPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const setupMutation = trpc.admin.setup.useMutation({
    onMutate: (variables) => {
      console.log('🚀 CLIENT: Starting setup mutation with variables:', variables);
      return variables;
    },
    onSuccess: (data, variables) => {
      console.log('✅ CLIENT: Setup mutation successful');
      console.log('📦 CLIENT: Response data:', data);
      console.log('📝 CLIENT: Original variables:', variables);
      alert('Setup completed successfully!');
      router.push('/'); // Redirect to home after successful setup
    },
    onError: (error, variables) => {
      console.error('❌ CLIENT: Setup mutation failed');
      console.error('🔴 CLIENT: Error details:', error);
      console.error('📝 CLIENT: Failed variables:', variables);
      setError(error.message || 'An error occurred during setup');
    },
    onSettled: (data, error, variables) => {
      console.log('🏁 CLIENT: Setup mutation settled');
      console.log('📊 CLIENT: Final state - data:', data, 'error:', error, 'variables:', variables);
    },
  });

  // Debug: expose mutation object shape at runtime once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // eslint-disable-next-line no-console
      console.log('🔎 CLIENT: setupMutation keys ->', Object.keys(setupMutation));
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('📝 CLIENT: Form submitted');
    console.log('🔐 CLIENT: Password length:', password.length);
    console.log('🎯 CLIENT: Mutation payload:', { password });
    console.log('🚀 CLIENT: Calling setupMutation.mutate()');

    setupMutation.mutate({ password });

    console.log('⏳ CLIENT: Mutation call initiated, waiting for response...');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">System Setup</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Setup Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter setup password"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={setupMutation.status === 'pending'}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              setupMutation.status === 'pending' ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {setupMutation.status === 'pending' ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}