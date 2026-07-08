using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GiapTech.Dentify.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceEntity : Migration
    {
        private static readonly Guid GeneralCheckupServiceId = new("00000000-0000-0000-0000-000000000001");
        private static readonly Guid FillingServiceId = new("00000000-0000-0000-0000-000000000002");
        private static readonly Guid ExtractionServiceId = new("00000000-0000-0000-0000-000000000003");
        private static readonly Guid WhiteningServiceId = new("00000000-0000-0000-0000-000000000004");
        private static readonly Guid RootCanalServiceId = new("00000000-0000-0000-0000-000000000005");
        private static readonly Guid OrthodonticsServiceId = new("00000000-0000-0000-0000-000000000006");
        private static readonly Guid ImplantServiceId = new("00000000-0000-0000-0000-000000000007");
        private static readonly Guid CleaningServiceId = new("00000000-0000-0000-0000-000000000008");
        private static readonly Guid CrownServiceId = new("00000000-0000-0000-0000-000000000009");
        private static readonly Guid OtherServiceId = new("00000000-0000-0000-0000-000000000010");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DrugId",
                table: "AppPrescriptionItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceId",
                table: "AppAppointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppDrugs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DefaultDosage = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppDrugs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppServices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeleterId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppServices", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppPrescriptionItems_DrugId",
                table: "AppPrescriptionItems",
                column: "DrugId");

            migrationBuilder.CreateIndex(
                name: "IX_AppAppointments_ServiceId",
                table: "AppAppointments",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppPrescriptionItems_AppDrugs_DrugId",
                table: "AppPrescriptionItems",
                column: "DrugId",
                principalTable: "AppDrugs",
                principalColumn: "Id");

            // Seed 1 Service per legacy TreatmentType enum value (deterministic Guid) so
            // existing Appointment rows can be mapped without losing the original meaning.
            migrationBuilder.InsertData(
                table: "AppServices",
                columns: new[] { "Id", "Name", "Price", "IsActive", "ExtraProperties", "ConcurrencyStamp", "CreationTime", "IsDeleted" },
                values: new object[,]
                {
                    { GeneralCheckupServiceId, "Khám tổng quát", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { FillingServiceId, "Trám răng", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { ExtractionServiceId, "Nhổ răng", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { WhiteningServiceId, "Tẩy trắng răng", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { RootCanalServiceId, "Điều trị tuỷ", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { OrthodonticsServiceId, "Chỉnh nha", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { ImplantServiceId, "Cấy ghép Implant", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { CleaningServiceId, "Cạo vôi răng", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { CrownServiceId, "Bọc răng sứ", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { OtherServiceId, "Khác", 0m, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                });

            migrationBuilder.Sql($@"
                UPDATE ""AppAppointments""
                SET ""ServiceId"" = CASE ""TreatmentType""
                    WHEN 0 THEN '{GeneralCheckupServiceId}'
                    WHEN 1 THEN '{FillingServiceId}'
                    WHEN 2 THEN '{ExtractionServiceId}'
                    WHEN 3 THEN '{WhiteningServiceId}'
                    WHEN 4 THEN '{RootCanalServiceId}'
                    WHEN 5 THEN '{OrthodonticsServiceId}'
                    WHEN 6 THEN '{ImplantServiceId}'
                    WHEN 7 THEN '{CleaningServiceId}'
                    WHEN 8 THEN '{CrownServiceId}'
                    WHEN 9 THEN '{OtherServiceId}'
                END::uuid;
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_AppAppointments_AppServices_ServiceId",
                table: "AppAppointments",
                column: "ServiceId",
                principalTable: "AppServices",
                principalColumn: "Id");

            migrationBuilder.DropColumn(
                name: "TreatmentType",
                table: "AppAppointments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppAppointments_AppServices_ServiceId",
                table: "AppAppointments");

            migrationBuilder.DropForeignKey(
                name: "FK_AppPrescriptionItems_AppDrugs_DrugId",
                table: "AppPrescriptionItems");

            migrationBuilder.DropTable(
                name: "AppDrugs");

            migrationBuilder.DropTable(
                name: "AppServices");

            migrationBuilder.DropIndex(
                name: "IX_AppPrescriptionItems_DrugId",
                table: "AppPrescriptionItems");

            migrationBuilder.DropIndex(
                name: "IX_AppAppointments_ServiceId",
                table: "AppAppointments");

            migrationBuilder.DropColumn(
                name: "DrugId",
                table: "AppPrescriptionItems");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "AppAppointments");

            migrationBuilder.AddColumn<int>(
                name: "TreatmentType",
                table: "AppAppointments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
