import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState({
    doctor: null,
    date: null,
    time: null,
    patientDetails: {
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      reason: ''
    }
  });

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
    setBookingData({
      doctor: null,
      date: null,
      time: null,
      patientDetails: {
        fullName: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        reason: ''
      }
    });
  };

  return (
    <BookingContext.Provider value={{ bookingData, updateBooking, updatePatientDetails, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
