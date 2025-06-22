import { useEffect, useState, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { checkCurrentShift, clearLastEndedShift } from "../../store/shiftSlice";

// Lazy load shift components
const StartShiftModal = lazy(() => import("./StartShiftModal"));
const ShiftEndSummary = lazy(() => import("./ShiftEndSummary"));

// Loading component for shift modals
const ShiftModalLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
        <p className="mt-2 text-gray-600">{t("shiftGuard.loading")}</p>
      </div>
    </div>
  );
};

function ShiftGuard({ children }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { hasActiveShift, loading, lastEndedShift } = useSelector(
    (state) => state.shift
  );

  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
  const [hasCheckedShift, setHasCheckedShift] = useState(false);
  const [awaitingNewShiftConfirmation, setAwaitingNewShiftConfirmation] =
    useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const isCashier = user?.role?.toLowerCase() === "cashier";
  const needsShiftManagement = isCashier; // Only cashiers need shift management

  // Reset state when user changes (logout/login with different account)
  useEffect(() => {
    if (user?._id !== currentUserId) {
      setHasCheckedShift(false);
      setIsStartShiftModalOpen(false);
      setAwaitingNewShiftConfirmation(false);
      setCurrentUserId(user?._id || null);
    }
  }, [user?._id, currentUserId]);

  // Check for active shift when cashier or manager logs in or when user changes
  useEffect(() => {
    if (needsShiftManagement && user?._id && !hasCheckedShift) {
      dispatch(checkCurrentShift())
        .then(() => {
          setHasCheckedShift(true);
        })
        .catch(() => {
          setHasCheckedShift(true); // Still mark as checked to prevent infinite loops
        });
    }
  }, [dispatch, needsShiftManagement, hasCheckedShift, user?._id]);

  // Handle post-shift-end state - wait for user acknowledgment
  useEffect(() => {
    if (
      needsShiftManagement &&
      hasCheckedShift &&
      !loading &&
      !hasActiveShift &&
      lastEndedShift
    ) {
      // If there's a recently ended shift, wait for user acknowledgment
      setAwaitingNewShiftConfirmation(true);
    }
  }, [
    needsShiftManagement,
    hasCheckedShift,
    loading,
    hasActiveShift,
    lastEndedShift,
  ]);

  // Show start shift modal if user has no active shift and has acknowledged previous shift end
  useEffect(() => {
    if (
      needsShiftManagement &&
      hasCheckedShift &&
      !loading &&
      !hasActiveShift &&
      !lastEndedShift &&
      !awaitingNewShiftConfirmation
    ) {
      setIsStartShiftModalOpen(true);
    } else {
      // Only close the modal if we're not in a state where it should be open
      if (!needsShiftManagement || hasActiveShift) {
        setIsStartShiftModalOpen(false);
      }
    }
  }, [
    needsShiftManagement,
    hasCheckedShift,
    loading,
    hasActiveShift,
    lastEndedShift,
    awaitingNewShiftConfirmation,
  ]);

  // Fallback mechanism - if user needs shift management but hasn't been checked after reasonable time
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (needsShiftManagement && !hasCheckedShift && !loading) {
        setHasCheckedShift(true);
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [needsShiftManagement, hasCheckedShift, loading]);

  const handleStartShiftClose = () => {
    // Users cannot close the modal - they must start a shift
    // Modal will close automatically when shift is started successfully
  };

  const handleAcknowledgeShiftEnd = () => {
    setAwaitingNewShiftConfirmation(false);
    setIsStartShiftModalOpen(true);
    dispatch(clearLastEndedShift());
  };

  // If waiting for shift end acknowledgment
  if (needsShiftManagement && awaitingNewShiftConfirmation && lastEndedShift) {
    return (
      <Suspense fallback={<ShiftModalLoader />}>
        <ShiftEndSummary
          shift={lastEndedShift}
          onAcknowledge={handleAcknowledgeShiftEnd}
          showAcknowledgeButton={true}
        />
      </Suspense>
    );
  }

  // If user doesn't have an active shift and modal is open, prevent normal app usage
  if (needsShiftManagement && !hasActiveShift && isStartShiftModalOpen) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Suspense fallback={<ShiftModalLoader />}>
          <StartShiftModal onClose={handleStartShiftClose} />
        </Suspense>
      </div>
    );
  }

  // Show loading while checking shift status
  if (needsShiftManagement && !hasCheckedShift && loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
          <p className="mt-2 text-gray-600">{t("shiftGuard.checkingShift")}</p>
        </div>
      </div>
    );
  }

  // Normal app usage for users without shift requirements or those with active shifts
  return children;
}

export default ShiftGuard;
