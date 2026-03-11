import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  maxWidthClass?: string;
  icon?: React.ReactNode;
}

const CustomModal = ({
  open,
  onClose,
  title,
  children,
  subtitle,
  maxWidthClass = "max-w-lg",
  icon,
}: CustomModalProps) => {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="modal-title">
      <div
        className={`absolute left-1/2 top-1/2 w-[92%] -translate-x-1/2 -translate-y-1/2 ${maxWidthClass} outline-none`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-secondary/70 bg-lighterblue text-white shadow-[0_20px_60px_rgba(1,10,38,0.65)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,234,182,0.16),transparent_45%)]" />
          <div className="h-1.5 w-full bg-secondary" />
          <div className="relative flex items-start justify-between gap-3 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              {icon && (
                <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow/50 bg-secondary text-white">
                  {icon}
                </div>
              )}
              <div className="max-w-[34rem]">
                <h2
                  id="modal-title"
                  className="font-header text-2xl leading-tight tracking-[0.01em] text-white sm:text-3xl"
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-2 text-sm leading-relaxed text-yellow/90 sm:text-base">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-yellow/40 text-yellow transition hover:bg-yellow hover:text-lighterblue"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>

          <div className="relative px-5 pb-6 sm:px-6 sm:pb-7">{children}</div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomModal;
