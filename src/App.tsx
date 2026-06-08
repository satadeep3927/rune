import { ThemeProvider } from "./features/theme";
import { MainLayout } from "./app/MainLayout";
import "./styles/index.css";

import { UpdaterPopup } from "./components/UpdaterPopup";

export default function App() {
  return (
    <ThemeProvider>
      <MainLayout />
      <UpdaterPopup />
    </ThemeProvider>
  );
}
