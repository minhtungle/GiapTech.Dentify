using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Tasks;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Tasks;

public abstract class TaskItemAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly ITaskItemAppService _taskItemAppService;

    protected TaskItemAppServiceTests()
    {
        _taskItemAppService = GetRequiredService<ITaskItemAppService>();
    }

    [Fact]
    public async Task Should_Create_Task_With_Default_Priority()
    {
        var result = await _taskItemAppService.CreateAsync(new CreateUpdateTaskItemDto
        {
            Title = "Đặt vật tư nha khoa"
        });

        result.Title.ShouldBe("Đặt vật tư nha khoa");
        result.Priority.ShouldBe(TaskPriority.Medium);
        result.IsDone.ShouldBeFalse();
    }

    [Fact]
    public async Task Should_Toggle_Done_Status()
    {
        var task = await _taskItemAppService.CreateAsync(new CreateUpdateTaskItemDto
        {
            Title = "Gọi lại khách hàng"
        });

        var toggled = await _taskItemAppService.ToggleDoneAsync(task.Id);
        toggled.IsDone.ShouldBeTrue();

        var toggledBack = await _taskItemAppService.ToggleDoneAsync(task.Id);
        toggledBack.IsDone.ShouldBeFalse();
    }

    [Fact]
    public async Task Should_Filter_List_By_IsDone()
    {
        var pending = await _taskItemAppService.CreateAsync(new CreateUpdateTaskItemDto { Title = "Việc chưa xong" });
        var done = await _taskItemAppService.CreateAsync(new CreateUpdateTaskItemDto { Title = "Việc đã xong" });
        await _taskItemAppService.ToggleDoneAsync(done.Id);

        var result = await _taskItemAppService.GetListAsync(new GetTaskItemListDto { IsDone = false });

        result.Items.ShouldContain(x => x.Id == pending.Id);
        result.Items.ShouldNotContain(x => x.Id == done.Id);
    }

    [Fact]
    public async Task Should_Get_Overview_Excluding_Done_Tasks()
    {
        var pending = await _taskItemAppService.CreateAsync(new CreateUpdateTaskItemDto
        {
            Title = "Việc ưu tiên cao",
            Priority = TaskPriority.High,
            DueDate = DateTime.UtcNow.AddDays(1)
        });
        var done = await _taskItemAppService.CreateAsync(new CreateUpdateTaskItemDto { Title = "Đã xong" });
        await _taskItemAppService.ToggleDoneAsync(done.Id);

        var overview = await _taskItemAppService.GetOverviewListAsync();

        overview.ShouldContain(x => x.Id == pending.Id);
        overview.ShouldNotContain(x => x.Id == done.Id);
    }

    [Fact]
    public async Task Should_Delete_Task()
    {
        var task = await _taskItemAppService.CreateAsync(new CreateUpdateTaskItemDto { Title = "Xoá thử" });

        await _taskItemAppService.DeleteAsync(task.Id);

        await Should.ThrowAsync<Exception>(async () => await _taskItemAppService.GetAsync(task.Id));
    }
}
