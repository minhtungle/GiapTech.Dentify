namespace GiapTech.Dentify;

public static class DentifyDomainErrorCodes
{
    /* You can add your business exception error codes here, as constants */

    public const string PatientNotFound = "Dentify:00001";
    public const string AppointmentNotFound = "Dentify:00002";
    public const string PaidAmountCannotExceedPrice = "Dentify:00003";
    public const string InvalidToothNumber = "Dentify:00004";
    public const string ToothRecordNotFound = "Dentify:00005";
    public const string UnsupportedPhotoContentType = "Dentify:00006";
    public const string PhotoSizeTooLarge = "Dentify:00007";
    public const string AppointmentPhotoNotFound = "Dentify:00008";
    public const string PrescriptionItemNotFound = "Dentify:00009";
    public const string PaymentNotFound = "Dentify:00010";
    public const string DoctorNotFound = "Dentify:00011";
    public const string DoctorAlreadyLinkedToUser = "Dentify:00012";
    public const string DoctorDoubleBooked = "Dentify:00013";
    public const string ServiceNotFound = "Dentify:00014";
    public const string ChairDoubleBooked = "Dentify:00015";
    public const string TreatmentPlanNotFound = "Dentify:00016";
    public const string TreatmentPlanItemNotFound = "Dentify:00017";
    public const string ConsentFormNotFound = "Dentify:00018";
    public const string UnsupportedConsentFormContentType = "Dentify:00019";
    public const string ConsentFormSizeTooLarge = "Dentify:00020";
    public const string SupplyNotFound = "Dentify:00021";
    public const string InsufficientSupplyQuantity = "Dentify:00022";
    public const string InsurancePolicyNotFound = "Dentify:00023";
    public const string PatientAlreadyLinkedToUser = "Dentify:00024";
    public const string PatientPortalAccountNotLinked = "Dentify:00025";
    public const string AppointmentBelongsToDifferentPatient = "Dentify:00026";
    public const string UnsupportedLogoContentType = "Dentify:00027";
    public const string LogoSizeTooLarge = "Dentify:00028";
    public const string ConcurrentBookingInProgress = "Dentify:00029";
    public const string InsurancePolicyExpiryBeforeEffective = "Dentify:00030";
}
