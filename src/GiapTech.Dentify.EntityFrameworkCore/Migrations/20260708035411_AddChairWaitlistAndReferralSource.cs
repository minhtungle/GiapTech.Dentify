using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GiapTech.Dentify.Migrations
{
    /// <inheritdoc />
    public partial class AddChairWaitlistAndReferralSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReferralSource",
                table: "AppPatients",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ChairId",
                table: "AppAppointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppChairs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
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
                    table.PrimaryKey("PK_AppChairs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppWaitlistEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: true),
                    ServiceId = table.Column<Guid>(type: "uuid", nullable: true),
                    PreferredTimeNote = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_AppWaitlistEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppWaitlistEntries_AppDoctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "AppDoctors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AppWaitlistEntries_AppPatients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "AppPatients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppWaitlistEntries_AppServices_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "AppServices",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppAppointments_ChairId",
                table: "AppAppointments",
                column: "ChairId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWaitlistEntries_DoctorId",
                table: "AppWaitlistEntries",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWaitlistEntries_PatientId",
                table: "AppWaitlistEntries",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWaitlistEntries_ServiceId",
                table: "AppWaitlistEntries",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_AppWaitlistEntries_Status",
                table: "AppWaitlistEntries",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_AppAppointments_AppChairs_ChairId",
                table: "AppAppointments",
                column: "ChairId",
                principalTable: "AppChairs",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppAppointments_AppChairs_ChairId",
                table: "AppAppointments");

            migrationBuilder.DropTable(
                name: "AppChairs");

            migrationBuilder.DropTable(
                name: "AppWaitlistEntries");

            migrationBuilder.DropIndex(
                name: "IX_AppAppointments_ChairId",
                table: "AppAppointments");

            migrationBuilder.DropColumn(
                name: "ReferralSource",
                table: "AppPatients");

            migrationBuilder.DropColumn(
                name: "ChairId",
                table: "AppAppointments");
        }
    }
}
