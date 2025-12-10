using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Timeco.Application.Services.Interfaces;

namespace Timeco.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SportsController : ControllerBase
{
    private readonly ISportService _sportService;

    public SportsController(ISportService sportService)
    {
        _sportService = sportService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _sportService.GetAllSportsAsync();
        return Ok(result.Data);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _sportService.GetSportByIdAsync(id);
        
        if (!result.Success)
            return NotFound(new { message = result.Message });

        return Ok(result.Data);
    }
}
