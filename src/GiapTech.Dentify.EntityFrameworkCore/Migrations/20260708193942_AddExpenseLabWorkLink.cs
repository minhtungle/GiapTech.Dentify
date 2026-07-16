using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GiapTech.Dentify.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseLabWorkLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LabWorkId",
                table: "AppExpenses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppExpenses_LabWorkId",
                table: "AppExpenses",
                column: "LabWorkId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppExpenses_AppLabWorks_LabWorkId",
                table: "AppExpenses",
                column: "LabWorkId",
                principalTable: "AppLabWorks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppExpenses_AppLabWorks_LabWorkId",
                table: "AppExpenses");

            migrationBuilder.DropIndex(
                name: "IX_AppExpenses_LabWorkId",
                table: "AppExpenses");

            migrationBuilder.DropColumn(
                name: "LabWorkId",
                table: "AppExpenses");
        }
    }
}
