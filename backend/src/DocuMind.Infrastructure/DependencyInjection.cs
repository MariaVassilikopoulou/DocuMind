using Azure;
using Azure.AI.OpenAI;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DocuMind.Application.Interfaces;
using DocuMind.Infrastructure.Options;
using DocuMind.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;

namespace DocuMind.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Azure Blob Storage ────────────────────────────────────────────────
        services.Configure<AzureStorageOptions>(
            configuration.GetSection(AzureStorageOptions.SectionName));

        services.AddSingleton(sp =>
        {
            var opts = sp.GetRequiredService<IOptions<AzureStorageOptions>>().Value;

            if (string.IsNullOrWhiteSpace(opts.ConnectionString))
                throw new InvalidOperationException(
                    "AzureStorage:ConnectionString is not configured. " +
                    "Add it to appsettings.Development.json or as an environment variable.");

            var containerClient = new BlobServiceClient(opts.ConnectionString)
                .GetBlobContainerClient(opts.ContainerName);

            containerClient.CreateIfNotExists(PublicAccessType.None);
            return containerClient;
        });

        // ── Azure OpenAI ──────────────────────────────────────────────────────
        services.Configure<AzureOpenAIOptions>(
            configuration.GetSection(AzureOpenAIOptions.SectionName));

        var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

        if (!isDevelopment)
        {
            // Production: register real Azure OpenAI client
            services.AddSingleton(sp =>
            {
                var opts = sp.GetRequiredService<IOptions<AzureOpenAIOptions>>().Value;

                if (string.IsNullOrWhiteSpace(opts.Endpoint) || string.IsNullOrWhiteSpace(opts.ApiKey))
                    throw new InvalidOperationException(
                        "AzureOpenAI:Endpoint and ApiKey must be configured in Production.");

                return new AzureOpenAIClient(
                    new Uri(opts.Endpoint),
                    new AzureKeyCredential(opts.ApiKey));
            });

            // Real service (Production)
            services.AddSingleton<IEmbeddingService, AzureOpenAIEmbeddingService>();
        }
        else
        {
            // Development: stub mode, no real client
            services.AddSingleton<IEmbeddingService>(_ => new AzureOpenAIEmbeddingService());
        }

        // ── Other service registrations ───────────────────────────────────────
        services.AddSingleton<IDocumentStorageService, AzureBlobStorageService>();
        services.AddSingleton<IVectorIndexService, InMemoryVectorIndexService>();
        services.AddSingleton<IChatCompletionService, StubChatCompletionService>();

        return services;
    }
}