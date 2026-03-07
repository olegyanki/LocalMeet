import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreateEventContextType {
  isOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

const CreateEventContext = createContext<CreateEventContextType | undefined>(undefined);

export function CreateEventProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSheet = () => setIsOpen(true);
  const closeSheet = () => setIsOpen(false);

  return (
    <CreateEventContext.Provider value={{ isOpen, openSheet, closeSheet }}>
      {children}
    </CreateEventContext.Provider>
  );
}

export function useCreateEvent() {
  const context = useContext(CreateEventContext);
  if (context === undefined) {
    throw new Error('useCreateEvent must be used within CreateEventProvider');
  }
  return context;
}
