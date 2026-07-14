export interface PlanFeatures {
  name: string;
  code: string;
  price: number;
  maxStudents: number | null;
  maxFaculty: number | null;
  maxCourses: number | null;
  maxAdmins: number | null;
  storageLimitGB: number | null;
  certificateSupport: boolean;
  analyticsSupport: boolean;
  brandingSupport: boolean;
  whiteLabelSupport: boolean;
  apiSupport: boolean;
}

export const PLANS_CONFIG: Record<string, PlanFeatures> = {
  free: {
    name: "Free",
    code: "free",
    price: 0,
    maxStudents: 50,
    maxFaculty: 5,
    maxCourses: 10,
    maxAdmins: 1,
    storageLimitGB: 2.0,
    certificateSupport: false,
    analyticsSupport: false,
    brandingSupport: false,
    whiteLabelSupport: false,
    apiSupport: false,
  },
  basic: {
    name: "Basic",
    code: "basic",
    price: 49,
    maxStudents: 300,
    maxFaculty: 20,
    maxCourses: 50,
    maxAdmins: 2,
    storageLimitGB: 20.0,
    certificateSupport: true,
    analyticsSupport: true,
    brandingSupport: false,
    whiteLabelSupport: false,
    apiSupport: false,
  },
  professional: {
    name: "Professional",
    code: "professional",
    price: 149,
    maxStudents: 1500,
    maxFaculty: 100,
    maxCourses: 250,
    maxAdmins: 5,
    storageLimitGB: 100.0,
    certificateSupport: true,
    analyticsSupport: true,
    brandingSupport: true,
    whiteLabelSupport: false,
    apiSupport: false,
  },
  enterprise: {
    name: "Enterprise",
    code: "enterprise",
    price: 499,
    maxStudents: null,
    maxFaculty: null,
    maxCourses: null,
    maxAdmins: null,
    storageLimitGB: null,
    certificateSupport: true,
    analyticsSupport: true,
    brandingSupport: true,
    whiteLabelSupport: true,
    apiSupport: true,
  },
};

export function getPlanFeatures(code: string): PlanFeatures | null {
  const norm = code.toLowerCase();
  
  // Direct match
  if (PLANS_CONFIG[norm]) {
    return PLANS_CONFIG[norm];
  }
  
  // Custom plan handling
  if (norm.startsWith("custom-")) {
    return {
      name: "Custom Plan",
      code: norm,
      price: 149.0,
      maxStudents: null,
      maxFaculty: null,
      maxCourses: null,
      maxAdmins: null,
      storageLimitGB: null,
      certificateSupport: true,
      analyticsSupport: true,
      brandingSupport: true,
      whiteLabelSupport: true,
      apiSupport: true,
    };
  }

  return null;
}
