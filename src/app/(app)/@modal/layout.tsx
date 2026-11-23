import { RoutedDialogHost } from "@/components/routed-dialog/routed-dialog"

// The Dialog roteado stays mounted while the intercepted routes inside it change.
export default function ModalLayout({ children }: { children: React.ReactNode }) {
  return <RoutedDialogHost>{children}</RoutedDialogHost>
}
