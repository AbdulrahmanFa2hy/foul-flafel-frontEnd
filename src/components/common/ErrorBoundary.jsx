import { Component } from "react";
import { withTranslation } from "react-i18next";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    const { t, i18n } = this.props;
    const isRTL = i18n?.language === "ar";

    if (this.state.hasError) {
      // Fallback UI
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-gray-50"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {t
                  ? t("errorBoundary.somethingWentWrong")
                  : "Something went wrong"}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {t
                  ? t("errorBoundary.errorMessage")
                  : "An error occurred while loading this page. Please try refreshing the page or contact support if the problem persists."}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => window.location.reload()}
                >
                  {t ? t("errorBoundary.refreshPage") : "Refresh Page"}
                </button>
              </div>

              {/* Development error details */}
              {import.meta.env.DEV && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    {t
                      ? t("errorBoundary.errorDetails")
                      : "Error Details (Development)"}
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                    <p className="font-semibold text-red-600">
                      {t ? t("errorBoundary.error") : "Error:"}
                    </p>
                    <pre className="whitespace-pre-wrap text-red-800">
                      {this.state.error?.toString()}
                    </pre>
                    <p className="font-semibold text-red-600 mt-2">
                      {t ? t("errorBoundary.stackTrace") : "Stack Trace:"}
                    </p>
                    <pre className="whitespace-pre-wrap text-red-800">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
