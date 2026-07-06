namespace GiapTech.Dentify;

public static class DentifyDomainErrorCodes
{
    /* You can add your business exception error codes here, as constants */

    public const string PatientNotFound = "Dentify:00001";
    public const string AppointmentNotFound = "Dentify:00002";
    public const string PaidAmountCannotExceedPrice = "Dentify:00003";
    public const string InvalidToothNumber = "Dentify:00004";
    public const string ToothRecordNotFound = "Dentify:00005";
}
