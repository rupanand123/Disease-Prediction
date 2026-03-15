export interface Patient {
  id?: string;
  userId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodPressure: number;
  cholesterol: number;
  glucose: number;
  bmi: number;
  heartRate: number;
  symptoms: string[];
  familyHistory: boolean;
  createdAt: string;
}

export interface Prediction {
  id?: string;
  userId: string;
  patientId?: string;
  diseaseType: 'heart_disease' | 'diabetes' | 'breast_cancer';
  probability: number;
  riskLevel: 'low' | 'moderate' | 'high';
  recommendation: string;
  medications?: string[];
  modelUsed: string;
  timestamp: string;
}

export type Page = 'home' | 'dashboard' | 'predict' | 'insights' | 'performance' | 'chat';
