import React from 'react';
import { Layer, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import styles from './billing-history-dashboard.scss';

export interface HistoryDashboardTab {
  id: string;
  label: string;
  icon?: React.ElementType;
  content: React.ReactNode;
}

interface HistoryDashboardShellProps {
  filters: React.ReactNode;
  metrics: React.ReactNode;
  tabs: Array<HistoryDashboardTab>;
  tabsAriaLabel: string;
}

export const HistoryDashboardShell = ({ filters, metrics, tabs, tabsAriaLabel }: HistoryDashboardShellProps) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  return (
    <>
      {filters}
      {metrics}
      <Layer className={styles.historyDashboard}>
        <Tabs onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)} selectedIndex={selectedIndex}>
          <TabList aria-label={tabsAriaLabel} className={styles.compactTabList} contained>
            {tabs.map((tab) => (
              <Tab key={tab.id} renderIcon={tab.icon}>
                {tab.label}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            {tabs.map((tab, index) => (
              <TabPanel key={tab.id}>{selectedIndex === index ? tab.content : null}</TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Layer>
    </>
  );
};
