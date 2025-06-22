const ErrorMessage = ({ message }) => (
  <div className="h-full min-h-[75vh] flex justify-center items-center">
    <span className="text-lg text-red-500">{message}</span>
  </div>
);

export default ErrorMessage;
