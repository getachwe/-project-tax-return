import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";

// Form validation schema
const formSchema = z.object({
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"], {
    required_error: "יש לבחור מצב משפחתי",
  }),
  income: z.number().min(1, "הכנסה חייבת להיות מספר חיובי"),
  taxPaid: z.number().min(0, "מס ששולם לא יכול להיות מספר שלילי"),
  taxCredits: z.number().min(0, "נקודות זיכוי לא יכולות להיות מספר שלילי"),
  children: z.number().min(0, "מספר ילדים לא יכול להיות שלילי"),
  academicDegree: z.boolean().optional(),
  newImmigrant: z.boolean().optional(),
  livingInPeriphery: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const ManualForm: React.FC = () => {
  const { taxData, setTaxData, goToNextStep, goToPreviousStep } =
    useTaxCalculator();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maritalStatus: (["single", "married", "divorced", "widowed"].includes(
        taxData.maritalStatus as string
      )
        ? taxData.maritalStatus
        : "single") as "single" | "married" | "divorced" | "widowed",
      income: taxData.income,
      taxPaid: taxData.taxPaid,
      taxCredits: taxData.taxCredits,
      children: 0,
      academicDegree: false,
      newImmigrant: false,
      livingInPeriphery: false,
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    // Calculate additional tax credits
    let additionalCredits = 0;

    // Children credits: 1 point for each child under 18
    additionalCredits += data.children * 1;

    // Academic degree: 0.25 points for first degree
    if (data.academicDegree) additionalCredits += 0.25;

    // New immigrant: 3 points for first year, 2 for second, 1 for third
    if (data.newImmigrant) additionalCredits += 3;

    // Living in periphery: 0.5 points
    if (data.livingInPeriphery) additionalCredits += 0.5;

    const totalTaxCredits = data.taxCredits + additionalCredits;

    setTaxData({
      ...taxData,
      maritalStatus: data.maritalStatus,
      income: data.income,
      taxPaid: data.taxPaid,
      taxCredits: totalTaxCredits,
      children: data.children,
      academicDegree: data.academicDegree,
      newImmigrant: data.newImmigrant,
      livingInPeriphery: data.livingInPeriphery,
    });

    goToNextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">השלמת נתונים</h2>
        <p className="text-gray-600">
          {taxData.hasFormData
            ? "הנתונים הבאים חולצו מהטופס שהעלית. אנא בדוק ותקן במידת הצורך."
            : "אנא הזן את הנתונים הבאים כדי שנוכל לחשב את החזר המס האפשרי שלך."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit as SubmitHandler<FormData>)}
        className="space-y-4"
      >
        <div className="mb-4">
          <label htmlFor="maritalStatus" className="form-label">
            מצב משפחתי
          </label>
          <select
            id="maritalStatus"
            className="input-field"
            {...register("maritalStatus", { required: true })}
          >
            <option value="">בחר/י...</option>
            <option value="single">רווק/ה</option>
            <option value="married">נשוי/אה</option>
            <option value="divorced">גרוש/ה</option>
            <option value="widowed">אלמן/ה</option>
          </select>
          {errors.maritalStatus && (
            <p className="error-text">{errors.maritalStatus.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="income" className="form-label">
              הכנסה שנתית ברוטו (₪)
            </label>
            <input
              id="income"
              type="number"
              className="input-field"
              {...register("income", { valueAsNumber: true })}
            />
            {errors.income && (
              <p className="error-text">{errors.income.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="taxPaid" className="form-label">
              מס הכנסה ששולם (₪)
            </label>
            <input
              id="taxPaid"
              type="number"
              className="input-field"
              {...register("taxPaid", { valueAsNumber: true })}
            />
            {errors.taxPaid && (
              <p className="error-text">{errors.taxPaid.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="taxCredits" className="form-label">
              נקודות זיכוי בסיסיות
            </label>
            <input
              id="taxCredits"
              type="number"
              step="0.25"
              className="input-field"
              {...register("taxCredits", { valueAsNumber: true })}
            />
            {errors.taxCredits && (
              <p className="error-text">{errors.taxCredits.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="children" className="form-label">
              מספר ילדים מתחת לגיל 18
            </label>
            <input
              id="children"
              type="number"
              className="input-field"
              {...register("children", { valueAsNumber: true })}
            />
            {errors.children && (
              <p className="error-text">{errors.children.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <h3 className="text-lg font-medium text-gray-900">זכאויות נוספות</h3>

          <div className="flex items-center">
            <input
              id="academicDegree"
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded ml-2"
              {...register("academicDegree")}
            />
            <label htmlFor="academicDegree" className="text-gray-700">
              בעל/ת תואר אקדמי (יש לי זכאות לנקודת זיכוי אקדמית)
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="newImmigrant"
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded ml-2"
              {...register("newImmigrant")}
            />
            <label htmlFor="newImmigrant" className="text-gray-700">
              עולה חדש/ה (עליתי לישראל ב-3.5 השנים האחרונות)
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="livingInPeriphery"
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded ml-2"
              {...register("livingInPeriphery")}
            />
            <label htmlFor="livingInPeriphery" className="text-gray-700">
              תושב/ת פריפריה (ישוב המזכה בהטבת מס)
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="btn-secondary inline-flex items-center"
          >
            <ArrowRight className="ml-1 h-4 w-4" />
            חזרה
          </button>

          <button
            type="submit"
            className="btn-primary inline-flex items-center"
          >
            המשך
            <ArrowLeft className="mr-1 h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
