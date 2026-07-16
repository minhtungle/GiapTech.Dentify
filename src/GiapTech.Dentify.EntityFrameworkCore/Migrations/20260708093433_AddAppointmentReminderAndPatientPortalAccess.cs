using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GiapTech.Dentify.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentReminderAndPatientPortalAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "IdentityUserId",
                table: "AppPatients",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReminderSentAt",
                table: "AppAppointments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppPatients_IdentityUserId",
                table: "AppPatients",
                column: "IdentityUserId",
                unique: true,
                filter: "\"IdentityUserId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AppPatients_IdentityUserId",
                table: "AppPatients");

            migrationBuilder.DropColumn(
                name: "IdentityUserId",
                table: "AppPatients");

            migrationBuilder.DropColumn(
                name: "ReminderSentAt",
                table: "AppAppointments");
        }
    }
}
