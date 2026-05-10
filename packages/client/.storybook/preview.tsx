import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import { IntlProvider } from 'react-intl';

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
    (Story) => (
      <IntlProvider locale="en-US" onError={() => {}}>
        <Story />
      </IntlProvider>
    ),
  ],
};

export default preview;
