import PaymentBadge from "./PaymentBadge";

const TableRow = ({ order }) => (
  <tr className="hover:bg-neutral-50 transition-colors">
    <td className="px-4 py-4 text-sm font-medium">{order.orderId}</td>
    <td className="px-4 py-4 text-sm">{order.date}</td>
    <td className="px-4 py-4 text-sm">{order.time}</td>
    <td className="px-4 sm:px-8 py-4 text-sm">{order.amount}</td>
    <td className="px-4 py-4">
      <PaymentBadge type={order.paymentMethod} />
    </td>
  </tr>
);

export default TableRow;
