import { ColorModeScript } from '@chakra-ui/react';
import { Head, Html, Main, NextScript } from 'next/document';

import defaultTheme from '@/shared/theme/lib/defaultTheme';

export default function Document() {
    return (
        <Html lang="en">
            <Head />
            <body>
                <ColorModeScript
                    initialColorMode={defaultTheme.config.initialColorMode}
                />
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
