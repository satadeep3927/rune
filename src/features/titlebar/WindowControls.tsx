import { useWindowControls } from "@/hooks/useWindowControls";
import { MinIcon } from "@/components/ui/icons/MinIcon";
import { MaxIcon } from "@/components/ui/icons/MaxIcon";
import { CloseIcon } from "@/components/ui/icons/CloseIcon";

export function WindowControls() {
  const { handleMinimize, handleMaximize, handleClose } = useWindowControls();

  return (
    <div class="flex h-full text-[var(--color-fg-muted)]">
      <button
        onClick={handleMinimize}
        class="w-[46px] h-full flex items-center justify-center hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)] transition-colors"
      >
        <MinIcon />
      </button>
      <button
        onClick={handleMaximize}
        class="w-[46px] h-full flex items-center justify-center hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)] transition-colors"
      >
        <MaxIcon />
      </button>
      <button
        onClick={handleClose}
        class="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-colors"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
