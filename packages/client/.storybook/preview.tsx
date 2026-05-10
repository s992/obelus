import { withThemeByClassName } from '@storybook/addon-themes';
import type { Decorator, Preview } from '@storybook/react-vite';
import { IntlProvider } from 'react-intl';

import { background, darkTheme, lightTheme } from '../src/style';
import '../src/style/reset.css';

const withBackground: Decorator = (Story) => (
  <div className={background} style={{ padding: 16 }}>
    <Story />
  </div>
);

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true }, // kill the manual backgrounds panel
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: lightTheme,
        dark: darkTheme,
      },
      defaultTheme: 'light',
    }),
    withBackground,
    (Story) => (
      <IntlProvider locale="en-US" onError={() => {}}>
        <Story />
      </IntlProvider>
    ),
  ],
};

export default preview;
