import { createContext } from 'react';

const SelectedDateContext = createContext({
  selectedDate: null as string | null,
  setSelectedDate: (date: string | null) => {},
});

export default SelectedDateContext;
