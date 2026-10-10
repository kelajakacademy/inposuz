import React, { Component } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem("pos_server_url");
    } catch (e) {}
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#141619] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-[#212428] p-8 rounded-2xl border border-red-500/30 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold mb-2 text-red-400">Tizimda xatolik yuz berdi</h1>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Dastur yuklanishida texnik xatolik aniqlandi. Iltimos, tugmani bosib dasturni qayta yuklang.
            </p>
            {this.state.error?.message && (
              <div className="w-full bg-[#181a1d] p-3 rounded-lg text-xs font-mono text-gray-400 mb-6 text-left overflow-x-auto max-h-32 border border-white/5">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 text-white font-semibold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tizimni qayta tiklash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
