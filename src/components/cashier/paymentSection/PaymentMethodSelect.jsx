import { useTranslation } from "react-i18next";

function PaymentMethodSelect({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <option value="cash">{t("cashier.cash")}</option>
      <option value="visa">{t("payment.visa")}</option>
    </select>
  );
}

export default PaymentMethodSelect;
