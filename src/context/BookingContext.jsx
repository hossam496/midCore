import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext();

const STORAGE_KEY = 'medcore_booking';

const DEFAULT_STATE = {
  doctor: null,
  date: null,
  time: null,
  startTime: null,
  endTime: null,
  appointmentNumber: null,
  patientDetails: {
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    reason: ''
  }
};

export const BookingProvider = ({ children }) => {
  // ✅ Initialize from sessionStorage so data survives SPA redirects & Vercel rewrites
  const [bookingData, setBookingData] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_STATE;
      const parsed = JSON.parse(stored);
      // Validate that the stored data has the expected shape
      if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
      // Merge with DEFAULT_STATE to handle schema changes
      return {
        ...DEFAULT_STATE,
        ...parsed,
        patientDetails: {
          ...DEFAULT_STATE.patientDetails,
          ...(parsed.patientDetails || {})
        }
      };
    } catch {
      return DEFAULT_STATE;
    }
  });

  // ✅ Persist every update to sessionStorage (survives navigations within the same tab)
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData));
    } catch {
      // Storage quota exceeded — silently ignore, in-memory state still works
    }
  }, [bookingData]);

  const updateBooking = (newData) => {
    setBookingData(prev => ({ ...prev, ...newData }));
  };

  const updatePatientDetails = (details) => {
    setBookingData(prev => ({
      ...prev,
      patientDetails: { ...prev.patientDetails, ...details }
    }));
  };

  const clearBooking = () => {
    setBookingData(DEFAULT_STATE);
    // ✅ Also remove from storage so confirmation page doesn't show stale data
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <BookingContext.Provider value={{ bookingData, updateBooking, updatePatientDetails, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used inside a BookingProvider');
  return context;
};
