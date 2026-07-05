$(function () {
    var l = abp.localization.getResource('Dentify');
    var ul = abp.localization.getResource('AbpUi');
    var appointmentService = giapTech.dentify.application.appointments.appointment;
    var statusNames = ['Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoShow'];
    var paymentStatusNames = ['Unpaid', 'PartiallyPaid', 'Paid'];

    var createModal = new abp.ModalManager({
        viewUrl: '/Appointments/CreateModal'
    });

    var editModal = new abp.ModalManager({
        viewUrl: '/Appointments/EditModal'
    });

    var paymentModal = new abp.ModalManager({
        viewUrl: '/Appointments/PaymentModal'
    });

    var dataTable = $('#AppointmentsTable').DataTable(
        abp.libs.datatables.normalizeConfiguration({
            serverSide: true,
            paging: true,
            order: [[0, 'desc']],
            searching: false,
            scrollX: true,
            ajax: abp.libs.datatables.createAjax(appointmentService.getList),
            columnDefs: [
                {
                    title: l('Appointment:ScheduledDateTime'),
                    data: 'scheduledDateTime',
                    render: function (data) {
                        return data ? luxon.DateTime.fromISO(data, { setZone: true }).toLocaleString(luxon.DateTime.DATETIME_MED) : '';
                    }
                },
                {
                    title: l('Appointment:Patient'),
                    data: 'patientFullName'
                },
                {
                    title: l('Appointment:Doctor'),
                    data: 'doctorName'
                },
                {
                    title: l('Appointment:Status'),
                    data: 'status',
                    render: function (data) {
                        return l('AppointmentStatus:' + statusNames[data]);
                    }
                },
                {
                    title: l('Appointment:Price'),
                    data: 'price'
                },
                {
                    title: l('Appointment:PaymentStatus'),
                    data: 'paymentStatus',
                    render: function (data) {
                        return l('PaymentStatus:' + paymentStatusNames[data]);
                    }
                },
                {
                    title: ul('Actions'),
                    rowAction: {
                        items: [
                            {
                                text: ul('Edit'),
                                visible: function () {
                                    return window.dentifyAppointments.canUpdate;
                                },
                                action: function (data) {
                                    editModal.open({ id: data.record.id });
                                }
                            },
                            {
                                text: l('Appointment:PaymentStatus'),
                                visible: function () {
                                    return window.dentifyAppointments.canManagePayment;
                                },
                                action: function (data) {
                                    paymentModal.open({ id: data.record.id });
                                }
                            },
                            {
                                text: ul('Delete'),
                                visible: function () {
                                    return window.dentifyAppointments.canDelete;
                                },
                                confirmMessage: function () {
                                    return l('Appointment:DeletionConfirmationMessage');
                                },
                                action: function (data) {
                                    appointmentService.delete(data.record.id).then(function () {
                                        abp.notify.success(ul('DeletedSuccessfully'));
                                        dataTable.ajax.reload();
                                    });
                                }
                            }
                        ]
                    }
                }
            ]
        })
    );

    $('#NewAppointmentButton').click(function (e) {
        e.preventDefault();
        createModal.open();
    });

    createModal.onResult(function () {
        dataTable.ajax.reload();
    });

    editModal.onResult(function () {
        dataTable.ajax.reload();
    });

    paymentModal.onResult(function () {
        dataTable.ajax.reload();
    });
});
