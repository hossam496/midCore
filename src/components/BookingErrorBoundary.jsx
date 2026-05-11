import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * BookingErrorBoundary — Class-based error boundary for the booking confirmation step.
 *
 * React error boundaries MUST be class components (hooks cannot catch render errors).
 * This catches ANY render-time crash in <BookingConfirmationPage /> — including
 * React error #306 (invalid hook call), #130 (invalid element), and third-party
 * library crashes (QRCode, html2canvas, confetti) — and shows a recovery UI
 * instead of a blank white screen.
 */
class BookingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log detailed error in development; suppress in production
    if (import.meta.env.DEV) {
      console.error('🔴 BookingErrorBoundary caught:', error, errorInfo);
    } else {
      // In production — log just the message without the full stack trace
      console.error('Booking confirmation error:', error?.message);
    }
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 border border-red-100 shadow-2xl shadow-red-900/5 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={36} />
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-3">
              حدث خطأ في صفحة التأكيد
            </h1>
            <p className="text-gray-500 text-sm mb-2 leading-relaxed">
              لا تقلق — موعدك قد تم تسجيله بنجاح في النظام.
              يمكنك مراجعة مواعيدك من لوحة التحكم.
            </p>

            {/* Error details — dev only */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 mb-6 text-left bg-red-50 rounded-xl p-4 border border-red-100">
                <summary className="text-xs font-bold text-red-600 cursor-pointer">
                  تفاصيل الخطأ (للمطور)
                </summary>
                <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                <RefreshCw size={18} />
                إعادة المحاولة
              </button>
              <a
                href="/"
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-gray-600 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Home size={18} />
                الصفحة الرئيسية
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BookingErrorBoundary;
