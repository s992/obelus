import type { Meta, StoryObj } from '@storybook/react-vite';

import { typography } from '@/style';

import { Tab } from './Tab';
import { TabList } from './TabList';
import { TabPanel } from './TabPanel';
import { TabPanels } from './TabPanels';
import { Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs>
      <TabList>
        <Tab id="details">Details</Tab>
        <Tab id="reviews">Reviews</Tab>
        <Tab id="similar">Similar</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="details">
          <span className={typography.body}>Book details and description.</span>
        </TabPanel>
        <TabPanel id="reviews">
          <span className={typography.body}>Reader reviews and ratings.</span>
        </TabPanel>
        <TabPanel id="similar">
          <span className={typography.body}>Similar books you might enjoy.</span>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
};

export const DefaultSelectedKey: Story = {
  render: () => (
    <Tabs defaultSelectedKey="reviews">
      <TabList>
        <Tab id="details">Details</Tab>
        <Tab id="reviews">Reviews</Tab>
        <Tab id="similar">Similar</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="details">
          <span className={typography.body}>Book details and description.</span>
        </TabPanel>
        <TabPanel id="reviews">
          <span className={typography.body}>Reader reviews and ratings.</span>
        </TabPanel>
        <TabPanel id="similar">
          <span className={typography.body}>Similar books you might enjoy.</span>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
};
