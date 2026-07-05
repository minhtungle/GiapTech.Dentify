$(function () {
    var l = abp.localization.getResource('Dentify');
    var ul = abp.localization.getResource('AbpUi');
    var patientService = giapTech.dentify.application.patients.patient;
    var genderNames = ['Male', 'Female', 'Other'];

    var createModal = new abp.ModalManager({
        viewUrl: '/Patients/CreateModal'
    });

    var editModal = new abp.ModalManager({
        viewUrl: '/Patients/EditModal'
    });

    var dataTable = $('#PatientsTable').DataTable(
        abp.libs.datatables.normalizeConfiguration({
            serverSide: true,
            paging: true,
            order: [[0, 'asc']],
            searching: false,
            scrollX: true,
            ajax: abp.libs.datatables.createAjax(patientService.getList, function () {
                return {
                    filter: $('#PatientFilterInput').val()
                };
            }),
            columnDefs: [
                {
                    title: l('Patient:FullName'),
                    data: 'fullName'
                },
                {
                    title: l('Patient:DateOfBirth'),
                    data: 'dateOfBirth',
                    render: function (data) {
                        return data ? luxon.DateTime.fromISO(data, { setZone: true }).toLocaleString(luxon.DateTime.DATE_MED) : '';
                    }
                },
                {
                    title: l('Patient:Gender'),
                    data: 'gender',
                    render: function (data) {
                        return l('Gender:' + genderNames[data]);
                    }
                },
                {
                    title: l('Patient:PhoneNumber'),
                    data: 'phoneNumber'
                },
                {
                    title: l('Patient:Tags'),
                    data: 'tags',
                    render: function (data) {
                        return (data || []).join(', ');
                    }
                },
                {
                    title: ul('Actions'),
                    rowAction: {
                        items: [
                            {
                                text: ul('Edit'),
                                visible: function () {
                                    return window.dentifyPatients.canUpdate;
                                },
                                action: function (data) {
                                    editModal.open({ id: data.record.id });
                                }
                            },
                            {
                                text: ul('Delete'),
                                visible: function () {
                                    return window.dentifyPatients.canDelete;
                                },
                                confirmMessage: function () {
                                    return l('Patient:DeletionConfirmationMessage');
                                },
                                action: function (data) {
                                    patientService.delete(data.record.id).then(function () {
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

    $('#NewPatientButton').click(function (e) {
        e.preventDefault();
        createModal.open();
    });

    createModal.onResult(function () {
        dataTable.ajax.reload();
    });

    editModal.onResult(function () {
        dataTable.ajax.reload();
    });

    var filterTimeout;
    $('#PatientFilterInput').on('keyup', function () {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(function () {
            dataTable.ajax.reload();
        }, 300);
    });
});
