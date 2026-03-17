using DocuMind.Application.UseCases;
using Microsoft.Extensions.DependencyInjection;

namespace DocuMind.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<UploadDocumentUseCase>();
        services.AddScoped<AskQuestionUseCase>();
        return services;
    }
}
