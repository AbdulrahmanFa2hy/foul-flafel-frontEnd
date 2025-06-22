import { useTranslation } from "react-i18next";

function PaymentBadge({ type }) {
  const { t } = useTranslation();

  // Support multiple payment methods separated by ' & '
  const types = type.split(" & ");

  const getClassName = (t) => {
    switch (t.toLowerCase()) {
      case "visa":
        return "bg-success-700 text-white rounded-xl text-sm w-2/3 leading-7 m-auto text-center shadow-lg";
      case "cash":
        return "bg-warning-700 text-white rounded-xl text-sm w-2/3 leading-7 m-auto text-center shadow-lg";
      default:
        return "bg-neutral-200 text-neutral-700 rounded-xl text-sm w-2/3 leading-7 m-auto text-center shadow-lg";
    }
  };

  const getTranslatedType = (type) => {
    switch (type.toLowerCase()) {
      case "visa":
        return t("paymentBadge.visa");
      case "cash":
        return t("paymentBadge.cash");
      case "mastercard":
        return t("paymentBadge.mastercard");
      default:
        return t("paymentBadge.unknown");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {types.map((type, idx) => (
        <div key={idx} className={getClassName(type)}>
          {getTranslatedType(type)}
        </div>
      ))}
    </div>
  );
}

export default PaymentBadge;
