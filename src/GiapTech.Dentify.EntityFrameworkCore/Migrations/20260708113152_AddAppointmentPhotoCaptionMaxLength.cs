using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GiapTech.Dentify.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentPhotoCaptionMaxLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Truncate any existing caption longer than the new limit first, so the
            // narrowing ALTER COLUMN below never fails against real data.
            migrationBuilder.Sql(
                "UPDATE \"AppAppointmentPhotos\" SET \"Caption\" = LEFT(\"Caption\", 256) WHERE LENGTH(\"Caption\") > 256;");

            migrationBuilder.AlterColumn<string>(
                name: "Caption",
                table: "AppAppointmentPhotos",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Caption",
                table: "AppAppointmentPhotos",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(256)",
                oldMaxLength: 256,
                oldNullable: true);
        }
    }
}
