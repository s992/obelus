import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';

import { darkTheme, lightTheme } from '../src/style';
import '../src/style/reset.css';

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: lightTheme,
        dark: darkTheme,
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
