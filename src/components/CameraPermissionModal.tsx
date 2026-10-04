import React from 'react';
import { Camera, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface CameraPermissionModalProps {
  isOpen: boolean;
  featureName: string;
  explanation: string;
  onAllow: () => void;
  onCancel: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  isOpen,
  featureName,
  explanation,
  onAllow,
  onCancel
}) => {
  const { isRTL } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C241E]/70 backdrop-blur-sm select-none">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded border border-[#D8CEC2] shadow-2xl p-6 text-xs text-[#3F3832]">
        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#EFE6DA] flex items-center justify-center text-[#54483C]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] tracking-wider uppercase font-bold text-[#756A60]">
              Camera Access Required · إذن استخدام الكاميرا
            </span>
            <h3 className="font-serif-arch text-base font-bold text-[#3F3832]">
              {featureName}
            </h3>
          </div>
        </div>

        {/* Short & Detailed Explanation */}
        <div className="space-y-2 mb-4">
          <p className="font-semibold text-xs text-[#54483C]">
            This feature requires camera access.
          </p>
          <p className="text-xs text-[#54483C] leading-relaxed bg-[#EFE6DA]/70 p-3 rounded border border-[#D8CEC2]">
            {explanation}
          </p>
        </div>

        <div className="text-[11px] text-[#756A60] space-y-1 bg-[#FAF7F2] p-2 rounded">
          <p>• DEAL never records or accesses your camera in the background.</p>
          <p>• Camera stream is strictly processed live in your browser.</p>
          <p>• You can stop and release the camera device at any moment.</p>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-[#D8CEC2]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-[#EFE6DA] text-[#54483C] rounded font-medium hover:bg-[#D8CEC2] transition-colors"
          >
            Cancel / إلغاء
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="px-5 py-2 bg-[#54483C] text-[#FAF7F2] rounded font-semibold hover:bg-[#3F3832] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Allow Camera / السماح بالكاميرا</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface CameraDeniedNoticeProps {
  onTryAgain: () => void;
  onContinueWithoutCamera: () => void;
}

export const CameraDeniedNotice: React.FC<CameraDeniedNoticeProps> = ({
  onTryAgain,
  onContinueWithoutCamera
}) => {
  return (
    <div className="bg-[#FAF7F2] p-5 rounded border border-[#D8CEC2] text-xs text-[#3F3832] space-y-3 shadow-sm">
      <div className="flex items-start gap-3 text-amber-900">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-700" />
        <div className="space-y-1">
          <span className="font-bold text-sm block">Camera access was denied. / تم رفض الوصول إلى الكاميرا.</span>
          <p className="text-xs text-[#54483C] leading-relaxed">
            Camera access is required for this feature, but you can continue using DEAL without camera-based features.
          </p>
          <p className="text-xs text-[#756A60] leading-relaxed" dir="rtl">
            يتطلب استخدام هذه الميزة الإذن بالوصول إلى الكاميرا، ولكن يمكنك متابعة استخدام منصة DEAL بدون استخدام الكاميرا من خلال رفع الملفات أو المحاكاة التفاعلية.
          </p>
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2 border-t border-[#D8CEC2]/60">
        <button
          onClick={onTryAgain}
          className="px-4 py-2 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-semibold hover:bg-[#3F3832] transition-colors shadow-sm"
        >
          Try Again / إعادة المحاولة
        </button>
        <button
          onClick={onContinueWithoutCamera}
          className="px-4 py-2 bg-[#EFE6DA] text-[#54483C] rounded text-xs font-medium border border-[#D8CEC2] hover:bg-[#D8CEC2] transition-colors"
        >
          Continue Without Camera / المتابعة بدون كاميرا
        </button>
      </div>
    </div>
  );
};
