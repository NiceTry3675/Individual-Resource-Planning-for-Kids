import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

export function PageTitle({ title, description, back = false, backTo = '/', action }: {
  title: string;
  description?: string;
  back?: boolean;
  backTo?: string;
  action?: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const goBack = () => {
    if (location.key === 'default') navigate(backTo, { replace: true });
    else navigate(-1);
  };

  return (
    <div className="space-y-3">
      {back && (
        <button
          type="button"
          onClick={goBack}
          aria-label="뒤로"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-fx-surface text-fx-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text"
        >
          <Icon name="back" />
        </button>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className={`min-w-0 ${back ? 'pt-1.5' : 'pt-1'}`}>
          <h1 ref={ref} tabIndex={-1} className={`${back ? 'text-3xl' : 'text-4xl'} font-bold tracking-tight text-fx-text outline-none`}>
            {title}
          </h1>
          {description && <p className="mt-1 text-base text-fx-text">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
