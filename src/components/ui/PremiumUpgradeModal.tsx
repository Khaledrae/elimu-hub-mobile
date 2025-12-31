// components/PremiumUpgradeModal.tsx
import subscriptionService, { SubscriptionPlan } from "@/src/services/subscriptionService";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback when payment succeeds
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [currentStep, setCurrentStep] = useState<"plan" | "payment">("plan");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible]);

  const loadPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const response = await subscriptionService.getPlans();
      console.log('Fetched plans:', response.plans);
      setPlans(response.plans);
      if (response.plans.length > 0) {
        setSelectedPlan(response.plans[0].id);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      showError('Error', 'Failed to load subscription plans');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const getPlanSavingsText = (plan: SubscriptionPlan) => {
    if (plan.code === 'yearly') {
      const monthlyPlan = plans.find(p => p.code === 'monthly');
      if (monthlyPlan) {
        const yearlyFromMonthly = monthlyPlan.price * 12;
        const savings = yearlyFromMonthly - plan.price;
        return `Save KSh ${savings}`;
      }
    }
    return '';
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const baseFeatures = [
      'Unlimited daily lessons',
      'Access to all classes',
      'Priority support',
      'Download lessons offline',
    ];

    if (plan.code === 'yearly') {
      return [...baseFeatures, 'Certificate of completion', 'Parent progress reports'];
    }
    
    if (plan.code === 'lifetime') {
      return [...baseFeatures, 'Lifetime updates', 'Dedicated support'];
    }
    
    return baseFeatures;
  };

  const handlePlanSelect = (planId: number) => {
    setSelectedPlan(planId);
    setCurrentStep('payment');
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      showError("Error", "Please select a plan");
      return;
    }

    if (!phoneNumber.trim()) {
      showError("Error", "Please enter your M-Pesa phone number");
      return;
    }

    try {
      setIsLoading(true);
      const result = await subscriptionService.initiatePayment({
        plan_id: selectedPlan,
        phone_number: phoneNumber,
      });

      if (result.success && result.checkout_request_id) {
        setCheckoutRequestId(result.checkout_request_id);
        startPaymentPolling(result.checkout_request_id);
      } else {
        showError(
          "Payment Failed",
          result.message || "Failed to initiate payment"
        );
      }
    } catch (error: any) {
      showError("Error", error.message || "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const startPaymentPolling = async (checkoutId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 3 minutes max (6-second intervals)

    const checkStatus = async () => {
      attempts++;

      try {
        const status = await subscriptionService.checkPaymentStatus(checkoutId);

        if (status.status === "completed") {
          showSuccess("Success!", "Premium subscription activated!");
          onClose();
          onSuccess?.();
          return true;
        } else if (status.status === "failed") {
          showError("Payment Failed", "Please try again or contact support");
          return false;
        }

        // Continue polling if still pending
        if (attempts < maxAttempts && status.status === "pending") {
          setTimeout(checkStatus, 6000); // Check every 6 seconds
        } else if (attempts >= maxAttempts) {
          showError(
            "Timeout",
            "Payment confirmation timed out. Please check your M-Pesa statement."
          );
          return false;
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 6000);
        }
      }
    };

    setTimeout(checkStatus, 2000); // Start after 2 seconds
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return cleaned.slice(0, 4) + " " + cleaned.slice(4);
    } else if (cleaned.length <= 9) {
      return (
        cleaned.slice(0, 4) + " " + cleaned.slice(4, 7) + " " + cleaned.slice(7)
      );
    } else {
      return (
        cleaned.slice(0, 4) +
        " " +
        cleaned.slice(4, 7) +
        " " +
        cleaned.slice(7, 10)
      );
    }
  };

  const getSelectedPlan = () => {
    return plans.find(plan => plan.id === selectedPlan);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Ionicons 
                name="star" 
                size={24} 
                color="#FFD700" 
                style={styles.headerIcon}
              />
              <Text style={styles.modalTitle}>
                {currentStep === "plan" ? "Choose Your Plan" : "Complete Payment"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {isLoadingPlans ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading plans...</Text>
              </View>
            ) : currentStep === "plan" ? (
              // Plan Selection Step
              <>
                <View style={styles.headerSection}>
                  <Text style={styles.planDescription}>
                    Upgrade to premium and unlock unlimited learning
                  </Text>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                </View>

                <View style={styles.planContainer}>
                  {plans.map((plan) => {
                    const savingsText = getPlanSavingsText(plan);
                    const isSelected = selectedPlan === plan.id;
                    
                    return (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.planCard,
                          isSelected && styles.planCardSelected,
                        ]}
                        onPress={() => handlePlanSelect(plan.id)}
                        activeOpacity={0.7}
                      >
                        {savingsText && (
                          <View style={styles.savingsBadge}>
                            <Ionicons name="trending-up" size={14} color="#fff" />
                            <Text style={styles.savingsText}>{savingsText}</Text>
                          </View>
                        )}
                        
                        <View style={[
                          styles.planIconContainer,
                          isSelected && styles.planIconContainerSelected
                        ]}>
                          <Ionicons 
                            name={plan.code === 'lifetime' ? 'infinite' : 'calendar'} 
                            size={24} 
                            color={isSelected ? "#FFD700" : "#4CAF50"} 
                          />
                        </View>
                        
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planPrice}>KSh {plan.price}</Text>
                        <Text style={styles.planPeriod}>
                          {plan.duration_days 
                            ? `for ${plan.duration_days} days` 
                            : 'Lifetime access'}
                        </Text>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.planFeatures}>
                          {getPlanFeatures(plan).map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                              <Ionicons 
                                name="checkmark-circle" 
                                size={16} 
                                color="#4CAF50" 
                                style={styles.featureIcon}
                              />
                              <Text style={styles.featureText}>{feature}</Text>
                            </View>
                          ))}
                        </View>
                        
                        <TouchableOpacity
                          style={[
                            styles.selectButton,
                            isSelected && styles.selectButtonSelected
                          ]}
                          onPress={() => handlePlanSelect(plan.id)}
                        >
                          <Text style={[
                            styles.selectButtonText,
                            isSelected && styles.selectButtonTextSelected
                          ]}>
                            {isSelected ? 'Selected ✓' : 'Select Plan'}
                          </Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => selectedPlan && setCurrentStep('payment')}
                  disabled={!selectedPlan}
                >
                  <Text style={styles.nextButtonText}>Continue to Payment</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              // Payment Step
              <>
                <View style={styles.paymentHeader}>
                  <TouchableOpacity 
                    style={styles.backToPlans}
                    onPress={() => setCurrentStep('plan')}
                  >
                    <Ionicons name="arrow-back" size={20} color="#4CAF50" />
                    <Text style={styles.backToPlansText}>Back to Plans</Text>
                  </TouchableOpacity>
                  
                  {getSelectedPlan() && (
                    <View style={styles.selectedPlanDisplay}>
                      <View style={styles.selectedPlanBadge}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.selectedPlanName}>
                          {getSelectedPlan()?.name}
                        </Text>
                      </View>
                      <Text style={styles.selectedPlanPrice}>
                        KSh {getSelectedPlan()?.price}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.paymentContainer}>
                  <View style={styles.paymentInfoCard}>
                    <Ionicons 
                      name="phone-portrait-outline" 
                      size={28} 
                      color="#4CAF50" 
                      style={styles.paymentIcon}
                    />
                    <Text style={styles.paymentTitle}>
                      Enter your M-Pesa phone number
                    </Text>
                    <Text style={styles.paymentDescription}>
                      You will receive an STK Push prompt to complete payment
                    </Text>

                    <View style={styles.phoneInputContainer}>
                      <View style={styles.phonePrefixContainer}>
                        <Text style={styles.phonePrefix}>+254</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="7XX XXX XXX"
                        value={formatPhoneNumber(phoneNumber)}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/\D/g, "");
                          setPhoneNumber(cleaned);
                        }}
                        keyboardType="phone-pad"
                        maxLength={12}
                        autoFocus
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      (isLoading || !phoneNumber.trim()) && styles.payButtonDisabled,
                    ]}
                    onPress={handlePayment}
                    disabled={isLoading || !phoneNumber.trim()}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="phone-portrait-outline"
                          size={22}
                          color="#fff"
                        />
                        <Text style={styles.payButtonText}>
                          Pay with M-Pesa
                        </Text>
                        <Ionicons name="lock-closed" size={16} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.paymentInstructions}>
                    <View style={styles.instructionsHeader}>
                      <Ionicons name="information-circle" size={20} color="#FFD700" />
                      <Text style={styles.instructionsTitle}>How to pay:</Text>
                    </View>
                    
                    {[
                      "Enter your M-Pesa registered phone number",
                      "Tap 'Pay with M-Pesa'",
                      "Enter your M-Pesa PIN on your phone when prompted",
                      "Wait for confirmation (usually within 60 seconds)"
                    ].map((step, index) => (
                      <View key={index} style={styles.instructionStep}>
                        <View style={styles.stepNumberContainer}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.securityNote}>
                    <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                    <Text style={styles.securityText}>
                      Your payment is secure and encrypted
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Styles with Yellow and Green Theme
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  planDescription: {
    fontSize: 16,
    color: '#34495e',
    flex: 1,
    lineHeight: 22,
    fontWeight: '500',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  premiumBadgeText: {
    color: '#2c3e50',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e8f5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#fffdf6',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 15,
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  planIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f8e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  planIconContainerSelected: {
    backgroundColor: '#fff9e6',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 2,
  },
  planPeriod: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 15,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#34495e',
    flex: 1,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  selectButtonSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  selectButtonTextSelected: {
    color: '#2c3e50',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  paymentHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backToPlans: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backToPlansText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedPlanDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  selectedPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  selectedPlanPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4CAF50',
  },
  paymentContainer: {
    paddingHorizontal: 20,
  },
  paymentInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentIcon: {
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 25,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8f5e9',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  phonePrefixContainer: {
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 2,
    borderRightColor: '#e8f5e9',
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  payButtonDisabled: {
    backgroundColor: '#a5d6a7',
    shadowOpacity: 0.1,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  paymentInstructions: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 8,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumberContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2c3e50',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    paddingTop: 2,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f8e9',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcedc8',
  },
  securityText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PremiumUpgradeModal;