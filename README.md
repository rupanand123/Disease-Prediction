# Disease Prediction AI 🏥

A sophisticated full-stack medical diagnostic application that leverages machine learning and generative AI to provide disease risk assessments and health insights.

## 🚀 Overview

Disease Prediction AI is designed to help users understand their health risks through data-driven analysis. By inputting key health metrics, users receive instant risk evaluations for major health conditions, accompanied by personalized recommendations and AI-powered medical guidance.

## 🛠️ Technologies Used

### Frontend
- **React 18**: For building a dynamic and responsive user interface.
- **TypeScript**: Ensuring type safety and robust code quality.
- **Tailwind CSS**: Modern utility-first styling for a sleek, dark-themed UI.
- **Recharts**: Advanced data visualization for health trends and risk distribution.
- **Motion (Framer Motion)**: Smooth animations and page transitions.
- **Lucide React**: Crisp, consistent iconography.

### Backend
- **Node.js & Express**: Handling API requests and prediction logic.
- **Vite (Middleware)**: Integrated development server and production asset serving.

### AI & Machine Learning
- **Google Gemini API**: Utilizing `gemini-3.1-pro-preview` with **Thinking Mode** for deep medical reasoning and patient interaction.
- **Predictive Models**: Simulated Gradient Boosted Trees (XGBoost) and Random Forest logic for high-accuracy risk assessment.

### Database & Security
- **Firebase Auth**: Secure Google Sign-in for patient identity.
- **Cloud Firestore**: Real-time NoSQL database for storing patient records and prediction history.
- **Firebase Security Rules**: Robust data protection and role-based access control.

## 📊 Datasets

The predictive logic in this application is inspired by and modeled after several renowned medical datasets:

1.  **Diabetes Dataset**: Based on the *Pima Indians Diabetes Database*, focusing on metrics like Glucose levels, BMI, and Age to predict diabetic risk.
2.  **Heart Disease Dataset**: Modeled after the *UCI Cleveland Heart Disease Dataset*, analyzing blood pressure, cholesterol, and family history.
3.  **Breast Cancer Dataset**: Inspired by the *Wisconsin (Diagnostic) Breast Cancer Dataset*, evaluating risk factors and historical data.

## ✨ Key Features

- **Multi-Disease Analysis**: Specialized prediction models for Heart Disease, Diabetes, and Breast Cancer.
- **Interactive Dashboard**: Real-time tracking of health stats and prediction history.
- **AI Health Assistant**: A dedicated chatbot to explain results and answer medical queries.
- **Medication Insights**: Suggests related medical tablets and treatments based on risk levels (for informational purposes).
- **Secure Records**: Encrypted storage of health data with private user access.

---

*Disclaimer: This application is an AI-powered tool for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.*
