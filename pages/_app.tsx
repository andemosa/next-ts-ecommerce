import "../styles/globals.css";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { SnackbarProvider } from "notistack";
import { StoreProvider } from "../utils/Store";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const jssStyles = document.querySelector("#jss-server-side")!;
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);
  return (
    <SnackbarProvider anchorOrigin={{ vertical: "top", horizontal: "center" }}>
      <StoreProvider>
        <PayPalScriptProvider deferLoading={true} options={{ "client-id": "test" }}>
          <Component {...pageProps} />
        </PayPalScriptProvider>
      </StoreProvider>
    </SnackbarProvider>
  );
}
export default MyApp;
