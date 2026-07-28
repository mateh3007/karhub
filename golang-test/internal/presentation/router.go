package presentation

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"

	"github.com/mateh3007/karhub/golang-test/internal/application/service"
	authuc "github.com/mateh3007/karhub/golang-test/internal/application/usecase/auth"
	companyuc "github.com/mateh3007/karhub/golang-test/internal/application/usecase/company"
	partuc "github.com/mateh3007/karhub/golang-test/internal/application/usecase/part"
	useruc "github.com/mateh3007/karhub/golang-test/internal/application/usecase/user"
	"github.com/mateh3007/karhub/golang-test/internal/domain/entity"
	"github.com/mateh3007/karhub/golang-test/internal/infra/config"
	"github.com/mateh3007/karhub/golang-test/internal/infra/jwtauth"
	"github.com/mateh3007/karhub/golang-test/internal/infra/postgres"
	infraredis "github.com/mateh3007/karhub/golang-test/internal/infra/redis"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/handler"
	"github.com/mateh3007/karhub/golang-test/internal/presentation/middleware"
)

// NewRouter builds the full dependency graph — repositories, services,
// usecases, handlers — and wires it to routes. There's no NestJS module
// system in Go, so this single function is where node-js-test's
// DatabaseModule/CompanyModule/UserModule/PartModule/AppModule composition
// (ADR 0016) all collapses to; the layering itself (domain/application/
// infra/presentation) is what's preserved, not the DI container.
func NewRouter(cfg *config.Config, pool *pgxpool.Pool, redisClient *goredis.Client) *gin.Engine {
	companyRepo := postgres.NewCompanyRepository(pool)
	userRepo := postgres.NewUserRepository(pool)
	partRepo := postgres.NewPartRepository(pool)

	cacheAdapter := infraredis.NewCacheAdapter(redisClient)
	jwtService := jwtauth.NewService(cfg.JWTSecret, cfg.JWTExpiresIn)
	priorityService := service.NewPartPriorityService()

	registerUC := authuc.NewRegisterUseCase(companyRepo, userRepo)
	loginUC := authuc.NewLoginUseCase(userRepo, jwtService)

	createCompanyUC := companyuc.NewCreateUseCase(companyRepo)
	getAllCompaniesUC := companyuc.NewGetAllUseCase(companyRepo)
	getCompanyByIDUC := companyuc.NewGetByIDUseCase(companyRepo)
	updateCompanyUC := companyuc.NewUpdateUseCase(companyRepo)
	deleteCompanyUC := companyuc.NewDeleteUseCase(companyRepo)

	createUserUC := useruc.NewCreateUseCase(userRepo, companyRepo)
	getAllUsersUC := useruc.NewGetAllUseCase(userRepo)
	getUserByIDUC := useruc.NewGetByIDUseCase(userRepo)
	updateUserUC := useruc.NewUpdateUseCase(userRepo)
	deleteUserUC := useruc.NewDeleteUseCase(userRepo)

	createPartUC := partuc.NewCreateUseCase(partRepo, cacheAdapter)
	getAllPartsUC := partuc.NewGetAllUseCase(partRepo)
	getPartByIDUC := partuc.NewGetByIDUseCase(partRepo)
	updatePartUC := partuc.NewUpdateUseCase(partRepo, cacheAdapter)
	deletePartUC := partuc.NewDeleteUseCase(partRepo, cacheAdapter)
	getRestockPrioritiesUC := partuc.NewGetRestockPrioritiesUseCase(partRepo, priorityService, cacheAdapter, cfg.RestockPrioritiesCacheTTL)

	authHandler := handler.NewAuthHandler(registerUC, loginUC)
	companyHandler := handler.NewCompanyHandler(createCompanyUC, getAllCompaniesUC, getCompanyByIDUC, updateCompanyUC, deleteCompanyUC)
	userHandler := handler.NewUserHandler(createUserUC, getAllUsersUC, getUserByIDUC, updateUserUC, deleteUserUC)
	partHandler := handler.NewPartHandler(createPartUC, getAllPartsUC, getPartByIDUC, updatePartUC, deletePartUC)
	restockHandler := handler.NewRestockHandler(getRestockPrioritiesUC)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSOrigins,
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Authorization", "Content-Type"},
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// /auth gets ONLY the stricter throttle (20/60s) — it replaces the
	// global one for these two routes rather than stacking with it,
	// mirroring the Node AuthController's @Throttle override (ADR 0015).
	authLimiter := middleware.NewRateLimiter(cfg.AuthThrottleLimit, cfg.AuthThrottleTTL)
	authGroup := router.Group("/auth")
	authGroup.Use(authLimiter.Middleware())
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
	}

	globalLimiter := middleware.NewRateLimiter(cfg.ThrottleLimit, cfg.ThrottleTTL)
	protected := router.Group("")
	protected.Use(globalLimiter.Middleware(), middleware.JWTAuth(jwtService))
	{
		companies := protected.Group("/companies")
		{
			companies.POST("", middleware.RequireRole(entity.RoleAdmin), companyHandler.Create)
			companies.GET("", companyHandler.FindAll)
			companies.GET("/:id", companyHandler.FindByID)
			companies.PUT("/:id", middleware.RequireRole(entity.RoleAdmin), companyHandler.Update)
			companies.DELETE("/:id", middleware.RequireRole(entity.RoleAdmin), companyHandler.Delete)
		}

		users := protected.Group("/users")
		{
			users.POST("", middleware.RequireRole(entity.RoleAdmin), userHandler.Create)
			users.GET("", userHandler.FindAll)
			users.GET("/:id", userHandler.FindByID)
			users.PUT("/:id", middleware.RequireRole(entity.RoleAdmin), userHandler.Update)
			users.DELETE("/:id", middleware.RequireRole(entity.RoleAdmin), userHandler.Delete)
		}

		parts := protected.Group("/parts")
		{
			parts.POST("", middleware.RequireRole(entity.RoleAdmin), partHandler.Create)
			parts.GET("", partHandler.FindAll)
			parts.GET("/:id", partHandler.FindByID)
			parts.PUT("/:id", middleware.RequireRole(entity.RoleAdmin), partHandler.Update)
			parts.DELETE("/:id", middleware.RequireRole(entity.RoleAdmin), partHandler.Delete)
		}

		protected.GET("/restock/priorities", restockHandler.Priorities)
	}

	return router
}
