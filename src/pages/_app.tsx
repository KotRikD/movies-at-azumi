import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';

import defaultTheme from '@/shared/theme/lib/defaultTheme';

export default function MyApp({ Component, pageProps }) {
    return (
        <ChakraProvider theme={defaultTheme}>
            <Toaster />
            <Component {...pageProps} />
        </ChakraProvider>
    );
}
