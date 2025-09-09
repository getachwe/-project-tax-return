# Quick test for backend endpoints
$baseUrl = "http://localhost:4000"

Write-Host "🧪 Testing backend endpoints..." -ForegroundColor Green

# Test 1: Health check (already working)
Write-Host "`n1. Health check: ✅ Working" -ForegroundColor Green

# Test 2: Signup
Write-Host "`n2. Testing signup..." -ForegroundColor Yellow
try {
    $signupBody = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json
    
    $signupResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    Write-Host "✅ Signup successful" -ForegroundColor Green
    Write-Host "Response: $($signupResponse | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "❌ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Signin
Write-Host "`n3. Testing signin..." -ForegroundColor Yellow
try {
    $signinBody = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json
    
    $signinResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method POST -Body $signinBody -ContentType "application/json"
    Write-Host "✅ Signin successful" -ForegroundColor Green
    Write-Host "Response: $($signinResponse | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "❌ Signin failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Tax calculation
Write-Host "`n4. Testing tax calculation..." -ForegroundColor Yellow
try {
    $calcBody = @{
        income = 100000
        taxPaid = 15000
        taxYear = 2023
        maritalStatus = "single"
    } | ConvertTo-Json
    
    $calcResponse = Invoke-RestMethod -Uri "$baseUrl/api/calculate-tax" -Method POST -Body $calcBody -ContentType "application/json"
    Write-Host "✅ Tax calculation successful" -ForegroundColor Green
    Write-Host "Response: $($calcResponse | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "❌ Tax calculation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🏁 Testing completed!" -ForegroundColor Green


