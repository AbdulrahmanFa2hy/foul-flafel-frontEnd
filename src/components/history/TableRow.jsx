import PaymentBadge from "./PaymentBadge";

const TableRow = ({ order }) => (
  <tr className="hover:bg-neutral-50 transition-colors">
    <td className="px-4 py-3 sm:py-4 text-sm font-medium whitespace-nowrap">
      {order.orderId}
    </td>
    <td className="px-4 py-3 sm:py-4 text-sm whitespace-nowrap">
      {order.date}
    </td>
    <td className="px-4 py-3 sm:py-4 text-sm whitespace-nowrap">
      {order.time}
    </td>
    <td className="px-4 py-3 sm:py-4 text-sm whitespace-nowrap ">
      {order.amount}
    </td>
    <td className="px-4 py-3 sm:py-4 text-center">
      <PaymentBadge type={order.paymentMethod} />
    </td>
  </tr>
);

export default TableRow;
