using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GiapTech.Dentify.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicalTerms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppMedicalTerms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_AppMedicalTerms", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppMedicalTerms_Name_Category",
                table: "AppMedicalTerms",
                columns: new[] { "Name", "Category" },
                unique: true);

            // Seed danh mục mẫu chuẩn y khoa ban đầu — Category: Allergy=0, MedicalCondition=1, Tag=2.
            // Dữ liệu bệnh nhân đã nhập tự do trước đây (Patient.Allergies/MedicalConditions/Tags)
            // không đối chiếu với danh mục này — chỉ áp dụng cho lần nhập mới trở đi.
            migrationBuilder.InsertData(
                table: "AppMedicalTerms",
                columns: new[] { "Id", "Name", "Category", "IsActive", "ExtraProperties", "ConcurrencyStamp", "CreationTime", "IsDeleted" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "Penicillin", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "Kháng sinh nhóm Sulfa", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "Aspirin/NSAID", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "Thuốc tê gốc -caine (Lidocaine...)", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000005"), "Latex (cao su)", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000006"), "I-ốt", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000007"), "Codeine", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000008"), "Nickel (kim loại nha khoa)", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("10000000-0000-0000-0000-000000000009"), "Penicillin V", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("1000000a-0000-0000-0000-00000000000a"), "Băng dính/băng gạc y tế", 0, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },

                    { new Guid("20000000-0000-0000-0000-000000000001"), "Đái tháo đường", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000002"), "Cao huyết áp", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000003"), "Bệnh tim mạch", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000004"), "Hen suyễn", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000005"), "Rối loạn đông máu", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000006"), "Viêm gan B/C", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000007"), "HIV", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000008"), "Động kinh", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("20000000-0000-0000-0000-000000000009"), "Loãng xương (đang dùng Bisphosphonate)", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("2000000a-0000-0000-0000-00000000000a"), "Suy thận", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("2000000b-0000-0000-0000-00000000000b"), "Đang mang thai", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("2000000c-0000-0000-0000-00000000000c"), "Rối loạn tuyến giáp", 1, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },

                    { new Guid("30000000-0000-0000-0000-000000000001"), "VIP", 2, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("30000000-0000-0000-0000-000000000002"), "Khách quen", 2, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                    { new Guid("30000000-0000-0000-0000-000000000003"), "Cần nhắc lịch", 2, true, "{}", Guid.NewGuid().ToString(), DateTime.UtcNow, false },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppMedicalTerms");
        }
    }
}
