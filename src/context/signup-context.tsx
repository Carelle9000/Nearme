import React, { createContext, useState, useContext } from 'react';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  birthYear: string;
  gender: string;
  city: string;
  bio: string;
  rulesAccepted: boolean;
}

interface SignupContextType {
  step: number;
  data: SignupData;
  updateData: (updates: Partial<SignupData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  clearSensitiveData: () => void;
}

const initialData: SignupData = {
  email: '',
  password: '',
  firstName: '',
  birthYear: '',
  gender: '',
  city: '',
  bio: '',
  rulesAccepted: false,
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SignupData>(initialData);

  const updateData = (updates: Partial<SignupData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const reset = () => {
    setStep(1);
    setData(initialData);
  };

  const clearSensitiveData = () => {
    setData((prev) => ({
      ...prev,
      password: '',
    }));
  };

  return (
    <SignupContext.Provider
      value={{
        step,
        data,
        updateData,
        nextStep,
        prevStep,
        reset,
        clearSensitiveData,
      }}
    >
      {children}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error('useSignup must be used within SignupProvider');
  }
  return context;
}
