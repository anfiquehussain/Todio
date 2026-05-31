import { toast } from 'sonner';

export const useToast = () => {
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    description?: string
  ) => {
    const options = {
      description,
      style: {
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-gray-border)',
        fontFamily: "var(--font-sans)",
      },
    };

    switch (type) {
      case 'success':
        toast.success(message, { ...options, duration: 3000 });
        break;
      case 'error':
        toast.error(message, { ...options, duration: 4000 });
        break;
      case 'warning':
        toast.warning(message, { ...options, duration: 3500 });
        break;
      case 'info':
      default:
        toast.info(message, { ...options, duration: 3000 });
        break;
    }
  };

  return { toast: showToast };
};
