import { Component, OnInit } from '@angular/core';
import { echartsBaseModel, echartsDerivativeModel, LLMService } from '@awesome/charts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'charts_example';
  baseModel: any;
  derivativeModel: any;

  constructor(private llm: LLMService) {}

  ngOnInit(): void {
    // ✅ test JSON exports
    this.baseModel = echartsBaseModel;
    this.derivativeModel = echartsDerivativeModel;

    console.log('Base model:', this.baseModel);
    console.log('Derivative model:', this.derivativeModel);

    this.llm.testValidation();   // should run AJV static validation tests
  }
}
